/**
 * Test script to verify SLM-first routing integration
 */

import { flowiseModelRouter } from './model-router';

async function testSLMFirstRouting() {
  console.log('Testing SLM-first routing integration...');

  try {
    // Test basic routing request
    const routingRequest = {
      task: 'Analyze this simple text for sentiment',
      context: {
        agentId: 'test-agent',
        workflowId: 'test-workflow',
        availableCapabilities: ['sentiment-analysis', 'text-processing'],
        organizationId: 1
      },
      organizationId: 1,
      priority: 'medium' as const
    };

    console.log('Making routing request...');
    const decision = await flowiseModelRouter.routeRequest(routingRequest);

    console.log('Routing decision:', {
      modelType: decision.selectedModel?.name,
      provider: decision.selectedModel?.provider,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      estimatedCost: decision.estimatedCost
    });

    // Test embedding generation
    console.log('Testing embedding generation...');
    const embedding = await flowiseModelRouter.generateEmbedding('Hello world');
    console.log('Embedding generated, length:', embedding.length);

    console.log('✅ SLM-first routing integration test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testSLMFirstRouting().catch(console.error);